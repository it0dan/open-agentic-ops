import type { DefaultSession } from "@auth/core/types";

declare module "@auth/core/types" {
  interface Session extends DefaultSession {
    access_token?: string;
    tenant_id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    tenant_id?: string;
  }
}
