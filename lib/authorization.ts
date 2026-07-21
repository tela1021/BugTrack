import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requireTeamAccess, type TeamRole } from "@/lib/team-access.mts";

export class AuthenticationError extends Error {
  constructor() {
    super("Authentication is required.");
  }
}

export class ResourceNotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} was not found.`);
  }
}

export class AuthorizationError extends Error {
  constructor() {
    super("You do not have permission to perform this action.");
  }
}

type AuthorizedTeamAccess = {
  userId: string;
  role: TeamRole;
};

export async function requireAuthenticatedUser(): Promise<string> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    throw new AuthenticationError();
  }

  return userId;
}

export async function requireTeamRole(
  teamId: string,
  requiredRole: TeamRole
): Promise<AuthorizedTeamAccess> {
  const userId = await requireAuthenticatedUser();
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });

  return {
    userId,
    role: requireTeamAccess(membership?.role, requiredRole),
  };
}

export async function requireGlobalAdmin(): Promise<string> {
  const userId = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new AuthorizationError();
  }

  return userId;
}

/** Workspace administrators may administer every team; team administrators may
 * administer only teams where they hold ADMIN or OWNER membership. */
export async function requireTeamAdminOrGlobal(teamId: string): Promise<AuthorizedTeamAccess> {
  const userId = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === 'ADMIN') return { userId, role: 'OWNER' };

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });
  return { userId, role: requireTeamAccess(membership?.role, 'ADMIN') };
}

export async function requireIssueAccess(
  issueId: number,
  requiredRole: TeamRole
): Promise<AuthorizedTeamAccess> {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { teamId: true },
  });

  if (!issue) {
    throw new ResourceNotFoundError("Issue");
  }

  return requireTeamRole(issue.teamId, requiredRole);
}
