// Written case studies, keyed by project slug (see utils/slug.js). A project listed here
// gets real copy on /work/<slug>; its page otherwise shows the "in progress" stub.
//
// Shape:
//   role (defaults to DEFAULT_ROLE), roleNote, focus (or timeline), industry   strings for the summary row
//   stack                     tags for the Stack row (falls back to the project's own tags)
//   summary                   optional; overrides the project's card summary at the top
//   sections[<section title>] { body: string[], points?: { title, text }[], figures?: Figure[] }
//   Figure: { kind: "image", src, alt, caption } or
//           { kind: "compare", before, after, beforeAlt, afterAlt, caption }
//   Static files live in public/case-studies/<slug>/. Sections without figures fall back to
//   the project's own gallery images.
// Used for any written case study that doesn't set its own `role`.
export const DEFAULT_ROLE = "Web Development Lead";

export const CASE_STUDY_CONTENT = {
  "community-transit": {
    role: DEFAULT_ROLE,
    roleNote: "BlueModus, client engagement",
    // Durable on purpose: dates would need editing when the engagement ends.
    focus: "Accessibility, trip planning and schedules",
    industry: "Public transit",
    // Shown in the Stack row (the project card keeps its own tags from the admin data).
    stack: [
      "Sitefinity",
      ".NET MVC",
      "React",
      "TypeScript",
      "Vite",
      "OpenTripPlanner",
      "Mapbox",
      "GTFS",
      "WCAG",
    ],
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
        figures: [
          {
            kind: "image",
            src: "/case-studies/community-transit/plan-my-trip.webp",
            alt: "The Plan My Trip page",
            caption:
              "Plan My Trip, one of the tools I built features for, including date and time entry and current-location support.",
          },
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
        figures: [
          {
            kind: "compare",
            before: "/case-studies/community-transit/route-before.webp",
            after: "/case-studies/community-transit/route-after.webp",
            beforeAlt: "The previous route page for Route 201",
            afterAlt: "The rebuilt route page for Route 201",
            caption:
              "A route page (Route 201), before and after. The rebuilt page leads with a timetable and a point-to-point view, with alerts, print and download close at hand.",
          },
        ],
      },
      Outcome: {
        body: [
          "The redesigned trip planning, Find My Bus and Maps & Schedules experiences moved through the client's review process, with the new Maps & Schedules available alongside the legacy pages for review before cutover. A broad accessibility backlog was closed across trip planning, the home page, news, the header and print flows.",
        ],
        figures: [
          {
            kind: "compare",
            before: "/case-studies/community-transit/maps-and-schedules-before.webp",
            after: "/case-studies/community-transit/maps-and-schedules-after.webp",
            beforeAlt: "The previous Maps & Schedules page",
            afterAlt: "The rebuilt Maps & Schedules page",
            caption:
              "Maps & Schedules, before and after. The rebuilt version separates maps and guides from schedule search.",
          },
          {
            kind: "compare",
            before: "/case-studies/community-transit/find-my-bus-before.webp",
            after: "/case-studies/community-transit/find-my-bus-after.webp",
            beforeAlt: "The previous Find My Bus page",
            afterAlt: "The rebuilt Find My Bus page",
            caption:
              "Find My Bus, before and after. Drag the handle to compare the previous page with the rebuilt version.",
          },
          {
            kind: "compare",
            before: "/case-studies/community-transit/stop-before.webp",
            after: "/case-studies/community-transit/stop-after.webp",
            beforeAlt: "The previous stop page",
            afterAlt: "The rebuilt stop page",
            caption:
              "A stop page, before and after: serving routes, real-time and scheduled departures, and a map centred on the stop.",
          },
        ],
      },
    },
  },
};

export const getCaseStudyContent = (slug) => CASE_STUDY_CONTENT[slug] || null;
