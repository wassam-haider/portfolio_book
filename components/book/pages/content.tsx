/**
 * Shared presentational pieces used by both the desktop flip book and the
 * mobile reader. Pure markup — no page-flip coupling.
 */
import type { Project, Profile, ProjectStatus } from "@/lib/types";

export function StatusSeal({ status }: { status: ProjectStatus }) {
  const label =
    status === "COMPLETED"
      ? "Chronicle Complete"
      : status === "ONGOING"
        ? "Still Being Inscribed"
        : "An Experiment";
  const tone =
    status === "COMPLETED"
      ? "border-[rgba(90,110,70,0.6)] text-[#4a5a38]"
      : status === "ONGOING"
        ? "border-[rgba(150,100,40,0.6)] text-[#8a5c20]"
        : "border-[rgba(100,80,130,0.55)] text-[#5c4a78]";
  return (
    <span
      className={`font-fell inline-block rounded-full border px-3 py-0.5 text-[11px] italic tracking-wide ${tone}`}
    >
      {label}
    </span>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-display small-caps mt-4 mb-1.5 text-[13px] font-semibold tracking-[0.1em] text-[var(--coffee-dark)]">
      {children}
    </h4>
  );
}

export function TechChips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span
          key={t}
          className="rounded-sm border border-[rgba(118,81,57,0.4)] bg-[rgba(118,81,57,0.08)] px-2 py-0.5 font-book text-xs font-semibold text-[var(--coffee-dark)]"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function InkList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1 font-book text-[15px] leading-snug text-[var(--ink-soft)]">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="mt-0.5 text-[var(--gold)]">
            ✦
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function isEmbeddable(url: string): string | null {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export function DemoVideo({ url, title }: { url: string; title: string }) {
  const embed = isEmbeddable(url);
  return (
    <figure className="my-2">
      <div className="overflow-hidden rounded-sm border border-[rgba(118,81,57,0.45)] bg-black/80 shadow-[0_3px_12px_rgba(33,21,15,0.35)]">
        {embed ? (
          <iframe
            src={embed}
            title={`${title} demo video`}
            className="aspect-video w-full"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <video src={url} controls preload="none" className="aspect-video w-full" />
        )}
      </div>
      <figcaption className="font-fell mt-1 text-center text-xs italic text-[var(--coffee)]">
        A moving illustration of {title}
      </figcaption>
    </figure>
  );
}

export function Screenshot({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-2">
      <div className="rounded-sm border border-[rgba(118,81,57,0.45)] bg-[var(--aged-paper-bright)] p-1.5 shadow-[0_3px_12px_rgba(33,21,15,0.3)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote admin uploads with unknown hosts */}
        <img src={src} alt={alt} loading="lazy" className="w-full rounded-[2px] object-cover" />
      </div>
      {caption && (
        <figcaption className="font-fell mt-1 text-center text-xs italic text-[var(--coffee)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Left page: overview. */
export function ProjectOverview({ project }: { project: Project }) {
  return (
    <>
      <p className="font-fell text-[11px] uppercase tracking-[0.25em] text-[var(--coffee)]">
        {project.category}
      </p>
      <h3 className="font-display mt-1 text-xl font-bold leading-tight text-[var(--ink)] sm:text-2xl">
        {project.title}
      </h3>
      <div className="mt-2 flex items-center gap-3">
        <StatusSeal status={project.status} />
      </div>
      <div className="ornament mt-3 text-sm">❦</div>

      {project.screenshots[0] && (
        <Screenshot
          src={project.screenshots[0]}
          alt={`${project.title} preview`}
          caption={`Plate I — ${project.title}`}
        />
      )}

      {project.shortDescription && (
        <p className="drop-cap mt-2 font-book text-[15px] leading-relaxed text-[var(--ink-soft)]">
          {project.shortDescription}
        </p>
      )}

      {project.problemStatement && (
        <>
          <SectionHeading>The Problem</SectionHeading>
          <p className="font-book text-[15px] leading-snug text-[var(--ink-soft)]">
            {project.problemStatement}
          </p>
        </>
      )}

      {project.objectives.length > 0 && (
        <>
          <SectionHeading>Objectives</SectionHeading>
          <InkList items={project.objectives} />
        </>
      )}
    </>
  );
}

/** Right page: technical details. */
export function ProjectDetails({ project }: { project: Project }) {
  return (
    <>
      {project.fullDescription && (
        <p className="font-book text-[15px] leading-relaxed text-[var(--ink-soft)]">
          {project.fullDescription}
        </p>
      )}

      {project.technologies.length > 0 && (
        <>
          <SectionHeading>Technologies &amp; Frameworks</SectionHeading>
          <TechChips items={project.technologies} />
        </>
      )}

      {project.architecture && (
        <>
          <SectionHeading>Architecture &amp; Implementation</SectionHeading>
          <p className="whitespace-pre-line font-book text-[15px] leading-snug text-[var(--ink-soft)]">
            {project.architecture}
          </p>
        </>
      )}

      {project.features.length > 0 && (
        <>
          <SectionHeading>Key Features</SectionHeading>
          <InkList items={project.features} />
        </>
      )}

      {project.challenges.length > 0 && (
        <>
          <SectionHeading>Trials &amp; Triumphs</SectionHeading>
          <div className="space-y-2">
            {project.challenges.map((c, i) => (
              <div key={i} className="border-l-2 border-[rgba(180,154,98,0.6)] pl-3">
                <p className="font-book text-[15px] font-semibold leading-snug text-[var(--ink)]">
                  {c.challenge}
                </p>
                <p className="font-book text-[14px] leading-snug text-[var(--ink-soft)]">
                  {c.solution}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {project.contribution && (
        <>
          <SectionHeading>The Maker&apos;s Hand</SectionHeading>
          <p className="font-book text-[15px] leading-snug text-[var(--ink-soft)]">
            {project.contribution}
          </p>
        </>
      )}

      {project.demoVideo && <DemoVideo url={project.demoVideo} title={project.title} />}

      {project.screenshots.slice(1).map((src, i) => (
        <Screenshot
          key={src}
          src={src}
          alt={`${project.title} screenshot ${i + 2}`}
          caption={`Plate ${["II", "III", "IV", "V", "VI", "VII"][i] ?? i + 2} — ${project.title}`}
        />
      ))}

      {(project.githubUrl || project.liveDemoUrl) && (
        <>
          <div className="ornament mt-4 text-sm">❦</div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-ink font-book text-[15px] font-semibold"
              >
                ⟡ View the Source Scrolls (GitHub)
              </a>
            )}
            {project.liveDemoUrl && (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-ink font-book text-[15px] font-semibold"
              >
                ⟡ Enter the Living Realm (Demo)
              </a>
            )}
          </div>
        </>
      )}
    </>
  );
}

/** About-the-developer page body, built from the profile. */
export function AboutContent({ profile }: { profile: Profile }) {
  return (
    <>
      {profile.introduction && (
        <p className="drop-cap font-book text-[15px] leading-relaxed text-[var(--ink-soft)]">
          {profile.introduction}
        </p>
      )}
      {profile.education && (
        <>
          <SectionHeading>Education</SectionHeading>
          <p className="whitespace-pre-line font-book text-[15px] leading-snug text-[var(--ink-soft)]">
            {profile.education}
          </p>
        </>
      )}
      {profile.skills.length > 0 && (
        <>
          <SectionHeading>Arts &amp; Disciplines</SectionHeading>
          <div className="space-y-2">
            {profile.skills.map((g) => (
              <div key={g.group}>
                <p className="font-book text-sm font-bold text-[var(--ink)]">{g.group}</p>
                <TechChips items={g.items} />
              </div>
            ))}
          </div>
        </>
      )}
      {profile.experience && (
        <>
          <SectionHeading>Experience</SectionHeading>
          <p className="whitespace-pre-line font-book text-[15px] leading-snug text-[var(--ink-soft)]">
            {profile.experience}
          </p>
        </>
      )}
      {profile.achievements && (
        <>
          <SectionHeading>Deeds of Note</SectionHeading>
          <p className="whitespace-pre-line font-book text-[15px] leading-snug text-[var(--ink-soft)]">
            {profile.achievements}
          </p>
        </>
      )}
      {profile.interests && (
        <>
          <SectionHeading>Curiosities</SectionHeading>
          <p className="whitespace-pre-line font-book text-[15px] leading-snug text-[var(--ink-soft)]">
            {profile.interests}
          </p>
        </>
      )}
      {profile.socialLinks.length > 0 && (
        <>
          <SectionHeading>Where to Seek the Maker</SectionHeading>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {profile.socialLinks.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-ink font-book text-[15px] font-semibold"
              >
                ⟡ {l.label}
              </a>
            ))}
          </div>
        </>
      )}
      {profile.contactInformation && (
        <p className="font-fell mt-4 text-sm italic text-[var(--coffee-dark)]">
          {profile.contactInformation}
        </p>
      )}
    </>
  );
}
