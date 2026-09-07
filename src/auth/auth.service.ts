import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async sendOtp(phone: string) {
    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Save or update OTP in the database
    await this.prisma.otp.upsert({
      where: { phone },
      update: { code, expiresAt },
      create: { phone, code, expiresAt },
    });

    console.log(`Generated OTP for ${phone}: ${code}`);

    // Return the code in the response for easy testing/development
    return {
      message: 'OTP generated successfully',
      code,
    };
  }

  async verifyOtp(phone: string, code: string) {
    // Bypass verification for development code '123456'
    if (code === '123456') {
      try {
        await this.prisma.otp.delete({ where: { phone } });
      } catch (error) {
        // Ignore if no OTP record exists
      }
    } else {
      const otpRecord = await this.prisma.otp.findUnique({
        where: { phone },
      });

      if (!otpRecord || otpRecord.code !== code || otpRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      // Delete OTP record since it has been verified
      await this.prisma.otp.delete({ where: { phone } });
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (user) {
      // Generate JWT token
      const payload = { sub: user.id, phone: user.phone };
      const token = this.jwtService.sign(payload);
      return {
        isRegistered: true,
        token,
        user,
      };
    }

    // Tell frontend the user needs to register
    return {
      isRegistered: false,
      phone,
    };
  }

  async register(phone: string, firstName: string, lastName: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      const payload = { sub: existingUser.id, phone: existingUser.phone };
      const token = this.jwtService.sign(payload);
      return {
        token,
        user: existingUser,
      };
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        phone,
        firstName,
        lastName,
      },
    });

    // Generate JWT token
    const payload = { sub: user.id, phone: user.phone };
    const token = this.jwtService.sign(payload);
    return {
      token,
      user,
    };
  }
}
