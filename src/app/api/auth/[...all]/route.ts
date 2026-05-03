import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

const handler = (req: NextRequest) => auth.handler(req);

export { handler as GET, handler as POST };
