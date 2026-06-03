import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const authConfig = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      credentials: {
        loginId: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.loginId || !credentials?.password) {
          return null;
        }

        const loginId = String(credentials.loginId);
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({
          where: {
            loginId,
          },
          include: {
            company: true,
          },
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: String(user.id),
          loginId: user.loginId,
          name: user.name,
          email: user.email,
          companyId: user.companyId,
          companyName: user.company.name,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.loginId = user.loginId;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.loginId = token.loginId as string;
        session.user.companyId = token.companyId as number;
        session.user.companyName = token.companyName as string;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth } = NextAuth(authConfig);