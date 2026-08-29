import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID ?? "oao-console",
      issuer: process.env.AUTH_KEYCLOAK_ISSUER ?? "http://localhost:8080/realms/oao",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.access_token = account.access_token;
        token.tenant_id = (profile as { tenant_id?: string } | undefined)?.tenant_id;
      }
      return token;
    },
    async session({ session, token }) {
      session.access_token = token.access_token as string | undefined;
      session.tenant_id = token.tenant_id as string | undefined;
      return session;
    },
  },
});
