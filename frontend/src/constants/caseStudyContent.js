// Written case studies, keyed by project slug (see utils/slug.js). A project listed here
// gets real copy on /work/<slug>; its page otherwise shows the "in progress" stub.
//
// Shape:
//   role, timeline            strings for the Role / Timeline row
//   summary                   optional; overrides the project's card summary at the top
//   sections[<section title>] { body: string[], points?: { title, text }[], captions?: string[] }
//   (captions line up with the screens shown in that section)
export const CASE_STUDY_CONTENT = {
  "community-transit": {
    role: "Senior Software Engineer, BlueModus",
    timeline: "June 2024 to present",
    summary:
      "Rider-facing features and accessibility work for the Community Transit website redesign: trip planning, rider alerts, global navigation and a rebuilt Maps & Schedules experience.",
    sections: {
      "The problem": {
        body: [
          "Community Transit serves riders across Snohomish County, and most of them arrive with one question and very little time: when is my bus, is anything delayed, how do I get there. Often that is on a phone, minutes before a departure.",
          "As a public agency, the site also has to meet accessibility standards, including formal audits. The redesign needed to make those everyday tasks faster and clearer, on a CMS-driven site that could not pause live service information while it changed.",
        ],
      },
      "My role": {
        body: [
          "I joined the BlueModus team on this engagement in June 2024 and have worked on it continuously since. I build React and TypeScript features inside the Sitefinity CMS and take each ticket from implementation through review and merge.",
        ],
        points: [
          {
            title: "Trip planning and rider alerts",
            text: "Mobile layouts, date and time entry, current-location handling, service-mode work and redesigned alerts.",
          },
          {
            title: "Header and global search",
            text: "The navigation and search app that sits on every page.",
          },
          {
            title: "Maps & Schedules redesign",
            text: "Route maps, favorites, stop detail with live arrivals, and print flows.",
          },
          {
            title: "Accessibility remediation",
            text: "Fixes driven by agency audits, across trip planning, the home page, news and the header.",
          },
        ],
      },
      Process: {
        body: [
          "The site is built from Sitefinity widgets that mount React apps and pass CMS content in as data. Trip planning and live arrivals draw on GTFS and real-time feeds, so the interface has to stay correct while the data changes underneath it.",
        ],
        points: [
          {
            title: "Accessibility as part of the build",
            text: "Live-region announcements for real-time updates, landmarks and a single main region, managed focus in modals, a sensible tab order, colour contrast and zoom controls. Audit findings became regular tickets rather than a late clean-up.",
          },
          {
            title: "Shipping the redesign beside the old site",
            text: "Redesigned Maps & Schedules pages could be reviewed on live URLs while the legacy pages stayed in place. I worked out a current/preview routing approach with CMS-managed page pairs, a preview banner, and the legacy page kept as the search canonical, after finding that a more obvious URL pattern would collide with CMS pages on deploy.",
          },
          {
            title: "Fresh maps and schedules",
            text: "Route maps and schedule PDFs are republished by staff on their own timing. Instead of tying cache-busting to the GTFS feed version, links now resolve to each document's real, versioned URL from the CMS library, so riders do not see stale files.",
          },
          {
            title: "Lighter pages",
            text: "A click-to-load video preview removes the embed cost from page load, and a small vanilla JavaScript modal replaced a heavier legacy React one.",
          },
        ],
        captions: [
          "Maps & Schedules: route maps with the rebuilt landing and favorites experience.",
          "Find My Bus: live arrivals beside a map, with updates announced to screen readers.",
        ],
      },
      Outcome: {
        body: [
          "The redesigned trip planning, rider alerts and Maps & Schedules experiences moved through the client's review process, with the new Maps & Schedules available alongside the legacy pages for review before cutover. A broad accessibility backlog was closed across trip planning, the home page, news, the header and print flows.",
        ],
        captions: [
          "Rider Alerts: alerts grouped by route, with clear status and details.",
        ],
      },
    },
  },
};

export const getCaseStudyContent = (slug) => CASE_STUDY_CONTENT[slug] || null;
