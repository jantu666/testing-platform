import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private async getUserRoleId(name: RoleName) {
    const role = await this.prisma.role.findUnique({ where: { name } });
    if (!role) throw new ConflictException('Role not seeded. Run prisma db seed.');
    return role.id;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const userRoleId = await this.getUserRoleId(RoleName.USER);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nickname: dto.nickname,
        roles: { create: { roleId: userRoleId } },
      },
      include: { roles: { include: { role: true } } },
    });
    const tokens = await this.issueTokens(user.id, user.email);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roles: { include: { role: true } } },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.blocked) {
      throw new UnauthorizedException('Account is blocked');
    }
    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueTokens(user.id, user.email);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: true } } },
    });
    if (!user || user.blocked) {
      throw new UnauthorizedException('User not found or blocked');
    }
    return this.issueTokens(user.id, user.email);
  }

  private async issueTokens(userId: string, email: string) {
    const accessPayload: JwtPayload = { sub: userId, email, type: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, email, type: 'refresh' };
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET') || 'dev-access';
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh';
    const accessExpires = this.config.get<string>('JWT_ACCESS_EXPIRES') || '15m';
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES') || '7d';
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, { secret: accessSecret, expiresIn: accessExpires }),
      this.jwt.signAsync(refreshPayload, { secret: refreshSecret, expiresIn: refreshExpires }),
    ]);
    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    nickname: string;
    avatarUrl: string | null;
    blocked: boolean;
    roles: { role: { name: RoleName } }[];
  }) {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      blocked: user.blocked,
      roles: user.roles.map((r) => r.role.name),
    };
  }
}
