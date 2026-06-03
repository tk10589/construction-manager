import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      loginId: string;
      companyId: number;
      companyName: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    loginId: string;
    companyId: number;
    companyName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    loginId: string;
    companyId: number;
    companyName: string;
  }
}