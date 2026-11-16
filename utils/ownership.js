const { ResponderTeam, Crew } = require("../models");
const { isSystemAdmin } = require("../middleware/auth");

/**
 * Can the authenticated caller manage the given responder team?
 *  - system admin (admin/serviceadmin user): any team
 *  - agency: teams belonging to that agency
 *  - responder: only its own team
 */
const canManageTeam = async (user, teamId) => {
  if (!user || teamId == null) return false;
  if (isSystemAdmin(user)) return true;
  if (user.type === "responder") return String(user.id) === String(teamId);
  if (user.type === "agency") {
    const team = await ResponderTeam.findByPk(teamId, {
      attributes: ["id", "agencyId"],
    });
    return !!team && String(team.agencyId) === String(user.id);
  }
  return false;
};

/** Can the caller manage the given crew member (via the crew's team)? */
const canManageCrew = async (user, crewId) => {
  const crew = await Crew.findByPk(crewId, {
    attributes: ["id", "responderTeamId"],
  });
  if (!crew) return null; // not found
  return canManageTeam(user, crew.responderTeamId);
};

module.exports = { canManageTeam, canManageCrew };
