export const TEAM_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

const roleRank: Record<TeamRole, number> = {
  MEMBER: 0,
  ADMIN: 1,
  OWNER: 2,
};

export function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === "string" && TEAM_ROLES.includes(value as TeamRole);
}

export function hasRequiredTeamRole(
  actualRole: string | null | undefined,
  requiredRole: TeamRole
): actualRole is TeamRole {
  return isTeamRole(actualRole) && roleRank[actualRole] >= roleRank[requiredRole];
}

export class TeamAccessError extends Error {
  code: "FORBIDDEN";

  constructor() {
    super("You do not have access to this team.");
    this.code = "FORBIDDEN";
  }
}

export function requireTeamAccess(
  membershipRole: string | null | undefined,
  requiredRole: TeamRole
): TeamRole {
  if (!hasRequiredTeamRole(membershipRole, requiredRole)) {
    throw new TeamAccessError();
  }

  return membershipRole;
}
