import { UsernameOrKaid, Scratchpads, UserProfileData, User } from "./types/data";
import { querySelectorPromise, querySelectorAllPromise } from "./util/promise-util";
import { getJSON } from "./util/api-util";
import { formatDate } from "./util/text-util";
import { DEVELOPERS } from "./types/names";
import { getCSRF } from "./util/cookie-util";
import {getKAID} from "./util/data-util";

async function addUserInfo (uok: UsernameOrKaid): Promise<void> {
	const userEndpoint = `${window.location.origin}/api/internal/user`;

	const Scratchpads = await getJSON(`${userEndpoint}/scratchpads?${uok.type}=${uok.id}&limit=1000`, {
		scratchpads: [{
			sumVotesIncremented: 1,
			spinoffCount: 1
		}]
	}) as Scratchpads;

	//TODO: Never fires and we don't get info if the user has thier statistics hidden
	const table = await querySelectorPromise(".user-statistics-table > tbody") as HTMLElement;

	const totals = Scratchpads.scratchpads.reduce((current, scratch) => {
		current.votes += scratch.sumVotesIncremented - 1;
		current.spinoffs += scratch.spinoffCount;
		current.inspiration += scratch.spinoffCount > 0 ? 1 : 0;
		return current;
	}, { programs: Scratchpads.scratchpads.length, votes: 0, spinoffs: 0, inspiration: 0 });

	const averageSpinoffs = Math.round(totals.spinoffs / totals.programs || 0);
	const averageVotes = Math.round(totals.votes / totals.programs || 0);

	const badges = await querySelectorAllPromise(".badge-category-count", 10, 500);
	const totalBadges = Array.from(badges).reduce((prev, badge): number => {
		return prev + (parseInt(badge.textContent || "") || 0);
	}, 0) || 0;

	const entries = {
		"Programs": totals.programs,
		"Total votes received": totals.votes,
		"Total spinoffs received": totals.spinoffs,
		"Average votes received": averageVotes,
		"Average spinoffs received": averageSpinoffs,
		"Total badges": totalBadges,
		"Inspiration badges": totals.inspiration,
		"More info": `<a href="${userEndpoint}/profile?${uok.type}=${uok.id}&format=pretty" target="_blank">API endpoint</a>`
	} as { [key: string]: string | number; };

	for (const entry in entries) {
		table.innerHTML += `<tr>
				<td class="user-statistics-label">${entry}</td>
				<td>${entries[entry]}</td>
			</tr>`;
	}

	getJSON(`${userEndpoint}/profile?${uok.type}=${uok.id}`, {
		dateJoined: 1,
		kaid: 1
	})
		.then(data => data as UserProfileData)
		.then(User => {
			const dateElement = document.querySelectorAll("td")[1];
			dateElement!.title = formatDate(User.dateJoined);

			if (DEVELOPERS.includes(User.kaid)) {
				table.innerHTML += `<div class="kae-green user-statistics-label">KA Extension Developer</div>`;
			}

			if (User.kaid === getKAID()) {
				fetch(`${window.location.origin}/api/internal/graphql/getFullUserProfile`, {
					method: "POST",
					headers: { "X-KA-FKey": getCSRF(), 'Accept': 'application/json', 'Content-Type': 'application/json'},
					body: JSON.stringify({"operationName":"getFullUserProfile","variables":{},"query":"query getFullUserProfile($kaid: String, $username: String) {\n  user(kaid: $kaid, username: $username) {\n    id\n    kaid\n    key\n    userId\n    email\n    username\n    profileRoot\n    gaUserId\n    qualarooId\n    isPhantom\n    isDeveloper: hasPermission(name: \"can_do_what_only_admins_can_do\")\n    isCurator: hasPermission(name: \"can_curate_tags\", scope: ANY_ON_CURRENT_LOCALE)\n    isCreator: hasPermission(name: \"has_creator_role\", scope: ANY_ON_CURRENT_LOCALE)\n    isPublisher: hasPermission(name: \"can_publish\", scope: ANY_ON_CURRENT_LOCALE)\n    isModerator: hasPermission(name: \"can_moderate_users\", scope: GLOBAL)\n    isParent\n    isSatStudent\n    isTeacher\n    isDataCollectible\n    isChild\n    isOrphan\n    isCoachingLoggedInUser\n    canModifyCoaches\n    nickname\n    hideVisual\n    joined\n    points\n    countVideosCompleted\n    publicBadges {\n      badgeCategory\n      description\n      isOwned\n      isRetired\n      name\n      points\n      absoluteUrl\n      hideContext\n      icons {\n        smallUrl\n        compactUrl\n        emailUrl\n        largeUrl\n        __typename\n      }\n      relativeUrl\n      safeExtendedDescription\n      slug\n      translatedDescription\n      translatedSafeExtendedDescription\n      __typename\n    }\n    bio\n    background {\n      name\n      imageSrc\n      __typename\n    }\n    soundOn\n    muteVideos\n    prefersReducedMotion\n    noColorInVideos\n    autocontinueOn\n    avatar {\n      name\n      imageSrc\n      __typename\n    }\n    hasChangedAvatar\n    newNotificationCount\n    canHellban: hasPermission(name: \"can_ban_users\", scope: GLOBAL)\n    canMessageUsers: hasPermission(name: \"can_send_moderator_messages\", scope: GLOBAL)\n    discussionBanned\n    isSelf: isActor\n    hasStudents: hasCoachees\n    hasClasses\n    hasChildren\n    hasCoach\n    badgeCounts\n    homepageUrl\n    isMidsignupPhantom\n    includesDistrictOwnedData\n    preferredKaLocale {\n      id\n      kaLocale\n      status\n      __typename\n    }\n    underAgeGate {\n      parentEmail\n      daysUntilCutoff\n      approvalGivenAt\n      __typename\n    }\n    authEmails\n    signupDataIfUnverified {\n      email\n      emailBounced\n      __typename\n    }\n    pendingEmailVerifications {\n      email\n      unverifiedAuthEmailToken\n      __typename\n    }\n    tosAccepted\n    shouldShowAgeCheck\n    __typename\n  }\n  actorIsImpersonatingUser\n}\n"}),
					credentials: "same-origin"
				}).then((response: Response): void => {
					response.json().then((res: { data?: any }): void => {
						if (!res.data.user.hasOwnProperty("discussionBanned")) {
							throw new Error("Error loading ban information.");
						}else {
							let bannedHTML = `<tr><td class="user-statistics-label">Banned</td>`;

							if (res.data.user.discussionBanned === null) {
								bannedHTML += `<td>No</td>`;
							}else if (res.data.user.discussionBanned === true) {
								bannedHTML += `<td style="color: red">Discussion banned</td>`;
							}else {
								throw new Error("Error loading ban information.");
							}

							const lastTR = table.querySelector("tr:last-of-type");
							if (!lastTR) { throw new Error("Table has no tr"); }
							lastTR.outerHTML = bannedHTML + `</tr>` + lastTR.outerHTML;
						}
					});
				}).catch(console.error);
			}
		});

}

//TODO: Fix or report to KA, currently disabled
function duplicateBadges (): void {
	const usedBadges = document.getElementsByClassName("used");
	if (usedBadges.length > 0) {
		for (let i = 0; i < usedBadges.length; i++) {
			usedBadges[i].classList.remove("used");
		}
	}
}

//TODO: Doesn't fire if switching from one profile page to another
//e.g: Opening khanacademy.com or clicking "Learner Home" to go to your own profile when on someone else's profile
function addProjectsLink (uok: UsernameOrKaid): void {
	querySelectorPromise("nav[data-test-id=\"side-nav\"] section:last-child ul").then(sidebarLinks => {
		//If we're on the projects page already, don't worry about adding it
		if (window.location.pathname.indexOf("projects") === -1) {
			let profileLink = document.querySelector("nav[data-test-id=\"side-nav\"] a[data-test-id=\"side-nav-profile\"]") as HTMLElement;
			console.log(profileLink.textContent);
			if (!profileLink || !profileLink.parentElement) {
				throw new Error("Failed to find profile element");
			}
			profileLink = profileLink.parentElement;

			profileLink.style.color = "red";

			const projectsLink = document.createElement("a");

			projectsLink.innerText = "Projects";
			projectsLink.href = `/profile/${uok}/projects`;
			projectsLink.classList.add("kae-projects-profile-link");

			profileLink.appendChild(projectsLink);
		}
	}).catch(console.error);
}

export { addUserInfo, duplicateBadges, addProjectsLink };
