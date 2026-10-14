/** Props for {@link SectionHeading}. */
export type SectionHeadingProps = { id?: string; title: string; description?: string };

/** The title and one-line explanation above a table or form inside a request section. */
export function SectionHeading({ id, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <h3 id={id} className="text-xs font-medium text-foreground">
        {title}
      </h3>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
