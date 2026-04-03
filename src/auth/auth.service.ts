import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    async register(email: string, password: string) {
        const existingUser = await this.usersService.findByEmail(email);

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.usersService.create(email, passwordHash);

        return this.buildAuthResponse(user.id, user.email);
    }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
    }

    async login(user: { userId: string; email: string; role: string }) {
        return this.buildAuthResponse(user.userId, user.email, user.role);
    }

    private async buildAuthResponse(userId: string, email: string, role = 'user') {
        const payload = { sub: userId, email, role };
        const accessToken = await this.jwtService.signAsync(payload);

        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: '1d',
            user: { id: userId, email, role },
        };
    }
}
