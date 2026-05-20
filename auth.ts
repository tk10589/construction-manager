import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      credentials: {
        loginId: {},
        password: {},
      },

      async authorize(credentials) {
        const loginId = credentials?.loginId;
        const password = credentials?.password;

        if (
          loginId === process.env.APP_LOGIN_ID &&
          password === process.env.APP_LOGIN_PASSWORD
        ) {
          return {
            id: "1",
            name: "管理者",
          };
        }

        return null;
      },
    }),
  ],
});