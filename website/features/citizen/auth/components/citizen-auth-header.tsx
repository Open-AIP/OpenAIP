type CitizenAuthHeaderProps = {
  titleId: string;
  descriptionId: string;
  title: string;
  description: string;
};

export default function CitizenAuthHeader({
  titleId,
  descriptionId,
  title,
  description,
}: CitizenAuthHeaderProps) {
  return (
    <header className="space-y-3 text-center">
      <h2 id={titleId} className="text-3xl font-bold text-[#052133] md:text-4xl">
        {title}
      </h2>
      <p id={descriptionId} className="text-base leading-relaxed text-slate-500">
        {description}
      </p>
    </header>
  );
}
