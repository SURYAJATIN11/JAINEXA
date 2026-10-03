# College Timetable AI — Implementation Tasks

## Verified college-data direction

- [ ] Treat https://ktiwari.in/webTT/ as the authoritative source for the college’s available programs, semesters, sections, faculty, subjects, rooms, schedules, reports, and building-plan references.
- [ ] Replace demo CSE A names, subjects, rooms, and schedule values with extracted college data.
- [ ] Preserve the college website’s functional coverage while rebuilding the presentation in our own visual system.
- [ ] Rework the primary timetable into a horizontal weekly class-hour layout.
- [ ] Make every occupied class-hour block clickable.
- [ ] Show the exact source-mapped teacher undertaking the selected subject, along with subject code, room, batch, period, and lecture/lab type.
- [ ] Validate the horizontal layout on desktop and mobile without losing readable class details.
- [ ] Document any data that is unavailable because the source site loads it dynamically or requires a user-provided export.

## Original product direction

- [ ] Keep the timetable as a separate, original College Timetable AI experience.
- [ ] Use the external reference only for feature coverage, not for layout, branding, styling, or screen structure.
- [ ] Preserve Campus Ledger visual language: paper depth, indigo rail, marigold signal, editorial typography, visible graph logic, and interactive session cards.
- [ ] Make the timetable visually ownable through distinctive session cards, rationale markers, timeline rhythm, and navigation patterns.

## College-wide modules from the reference

- [ ] Add a college-wide workspace navigation covering Home, Batch Timetable, Faculty Timetable, Subject Schedule, Room Schedule, Building Floor Plan, PDF Reports, Meeting Slot Finder, and Adjustments.
- [ ] Preserve the interactive timetable matrix as the central experience across all programs, departments, batches, faculty, subjects, and rooms.
- [ ] Add a teacher window that shows only the signed-in teacher’s assigned sessions and opens attendance for the selected session.
- [ ] Add attendance capture for present, absent, late, and excused states, with date/session metadata and class roster support.
- [ ] Add attendance summaries by student, batch, subject, faculty, and date range.
- [ ] Keep the architecture ready for the supplied college data instead of inventing program, student, or faculty records.
- [ ] Ingest the supplied ground-floor plan as the first verified building-map source.
- [ ] Normalize all three supplied floors by building, floor, room number, description, area, capacity, and lab type.
- [ ] Register verified second-floor rooms 201–227, including lecture halls, faculty rooms, library, electronics/research labs, electrical lab, civil CAD lab, workshop, coating lab, computer labs, CAD/CAM lab, and Makers Lab.
- [ ] Register verified first-floor rooms 101–127-C, including lecture halls, seminar hall, tutorial room, engineering labs, computer labs, project lab, and administrative rooms.
- [ ] Link each room on the floor plan to its timetable assignments and teacher attendance sessions.

## Experience goals

- [ ] Make the timetable the visual centerpiece rather than a conventional data table.
- [ ] Add an animated “generate” sequence with visible graph-coloring and constraint-checking progress.
- [ ] Add interactive session cards with hover, focus, and click details for subject, faculty, room, batch, and rationale.
- [ ] Add visual filters for student, faculty, room, and conflict perspectives without losing the current schedule context.
- [ ] Add conflict highlighting with clear explanations and a friendly resolution path.
- [ ] Add satisfying micro-interactions, responsive transitions, and reduced-motion support.
- [ ] Make the timetable pleasant on desktop and usable on smaller screens.

## Product logic

- [ ] Model subjects, faculty, batches, rooms, time slots, availability, and lab requirements.
- [ ] Implement a sample graph-coloring / constraint-based schedule generator.
- [ ] Validate teacher, classroom, batch, time, laboratory, and availability constraints.
- [ ] Calculate summary metrics and produce a conflict report.

## Delivery

- [ ] Add project documentation for SIH, KSCST, IEEE, startup-incubator, and patent-oriented positioning.
- [ ] Run type checking and production build.
- [ ] Capture representative screenshots and create the first complete checkpoint.
