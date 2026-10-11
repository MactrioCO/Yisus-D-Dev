import { useCallback, useEffect, useState } from "react";
import About from "./components/About";
import BackgroundFX from "./components/BackgroundFX";
import Contact from "./components/Contact";
import ErrorBoundary from "./components/ErrorBoundary";
import Experience from "./components/Experience";
import Faqs from "./components/Faqs";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import MactrioWidget from "./components/MactrioWidget";
import Navbar from "./components/Navbar";
import News from "./components/News";
import Preloader from "./components/Preloader";
import Process from "./components/Process";
import ProjectModal from "./components/ProjectModal";
import Projects from "./components/Projects";
import Services from "./components/Services";
import Skills from "./components/Skills";
import { navLinks, type Project } from "./config/site";
import { loadPublicContent, localContent, type PublicContent } from "./lib/cms";
import OwnerApp from "./owner/OwnerApp";

const isOwnerRoute = () => window.location.hash.startsWith("#/owner");

/** Oculta del menú las secciones sin contenido (nada de enlaces rotos). */
function visibleNav(c: PublicContent) {
  return navLinks.filter((l) => {
    if (l.id === "stack") return c.skills.length > 0;
    if (l.id === "proyectos") return c.projects.length > 0;
    if (l.id === "servicios") return c.services.length > 0;
    if (l.id === "novedades") return c.news.length > 0;
    if (l.id === "experiencia") return c.experience.length + c.education.length + c.certifications.length > 0;
    if (l.id === "faqs") return c.faqs.length > 0;
    return true;
  });
}

export default function App() {
  const [owner, setOwner] = useState(isOwnerRoute);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("inicio");
  const [selected, setSelected] = useState<Project | null>(null);
  const [content, setContent] = useState<PublicContent>(localContent);

  const finishLoad = useCallback(() => setLoading(false), []);

  useEffect(() => {
    const onHash = () => {
      const o = isOwnerRoute();
      setOwner(o);
      if (o) {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Contenido público: Supabase si hay publicado, config local si no
  useEffect(() => {
    loadPublicContent().then(setContent);
  }, []);

  useEffect(() => {
    const failsafe = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(failsafe);
  }, []);

  useEffect(() => {
    if (loading || owner) return;
    const ids = visibleNav(content).map((l) => l.id);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, owner, content]);

  if (owner) return <OwnerApp />;

  return (
    <div className="relative min-h-screen bg-[#05070d] text-slate-200">
      <a href="#sobre-mi" className="skip-link">
        Saltar al contenido
      </a>
      {loading && <Preloader onDone={finishLoad} />}
      <BackgroundFX />
      <Navbar active={active} links={visibleNav(content)} />

      <main id="contenido" className="relative z-10">
        <ErrorBoundary><Hero started={!loading} socials={content.socials} /></ErrorBoundary>
        <ErrorBoundary><About /></ErrorBoundary>
        {content.skills.length > 0 && <ErrorBoundary><Skills groups={content.skills} /></ErrorBoundary>}
        {content.projects.length > 0 && <ErrorBoundary><Projects onOpen={setSelected} items={content.projects} /></ErrorBoundary>}
        <ErrorBoundary><News posts={content.news} /></ErrorBoundary>
        {content.services.length > 0 && <ErrorBoundary><Services list={content.services} /></ErrorBoundary>}
        <ErrorBoundary><Process /></ErrorBoundary>
        {(content.experience.length + content.education.length + content.certifications.length) > 0 && (
          <ErrorBoundary><Experience exp={content.experience} edu={content.education} certs={content.certifications} /></ErrorBoundary>
        )}
        <ErrorBoundary><Faqs items={content.faqs} /></ErrorBoundary>
        <ErrorBoundary><Contact socials={content.socials} contact={content.contact} /></ErrorBoundary>
      </main>

      <div className="relative z-10">
        <ErrorBoundary>
          <Footer socials={content.socials} links={visibleNav(content)} contact={content.contact} />
        </ErrorBoundary>
      </div>

      <MactrioWidget content={content} />
      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
