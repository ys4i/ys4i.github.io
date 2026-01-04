// ScrollSpy that only tracks headings present in the ToC to avoid desync with hidden headings.
// ToC に載っている見出しだけを監視し、目次に無い見出し（details 内の h4 など）で現在地がずれる問題を防ぐ
function debounced(func: Function) {
    let timeout;
    return () => {
        if (timeout) window.cancelAnimationFrame(timeout);
        timeout = window.requestAnimationFrame(() => func());
    };
}

const tocQuery = "#TableOfContents";
const tocLinkQuery = "#TableOfContents a[href^='#']";
const navigationQuery = "#TableOfContents li";
const activeClass = "active-class";

type IdToElementMap = { [key: string]: HTMLElement };

function buildIdToNavigationElementMap(navigation: NodeListOf<Element>): IdToElementMap {
    const map: IdToElementMap = {};
    navigation.forEach((el: HTMLElement) => {
        const link = el.querySelector("a[href^='#']");
        if (!link) return;
        const href = link.getAttribute("href");
        if (href) map[href.slice(1)] = el;
    });
    return map;
}

function collectHeadersFromToc(): HTMLElement[] {
    const links = Array.from(document.querySelectorAll(tocLinkQuery)) as HTMLAnchorElement[];
    return links
        .map((link) => document.getElementById(link.getAttribute("href")!.slice(1)))
        .filter((el): el is HTMLElement => !!el);
}

function computeOffsets(headers: HTMLElement[]) {
    return headers
        .map((h) => ({ id: h.id, offset: h.offsetTop }))
        .sort((a, b) => a.offset - b.offset);
}

function scrollToTocElement(tocElement: HTMLElement, scrollableNavigation: HTMLElement) {
    const textHeight = tocElement.querySelector("a")?.offsetHeight ?? 0;
    let scrollTop =
        tocElement.offsetTop -
        scrollableNavigation.offsetHeight / 2 +
        textHeight / 2 -
        scrollableNavigation.offsetTop;
    scrollTop = Math.max(scrollTop, 0);
    scrollableNavigation.scrollTo({ top: scrollTop, behavior: "smooth" });
}

function setupScrollspy() {
    const scrollableNavigation = document.querySelector(tocQuery) as HTMLElement | null;
    const navigation = document.querySelectorAll(navigationQuery);
    const headers = collectHeadersFromToc();

    if (!scrollableNavigation || !headers.length || !navigation.length) return;

    let sectionsOffsets = computeOffsets(headers);
    let activeSectionLink: Element | undefined;
    const idToNavigationElement = buildIdToNavigationElementMap(navigation);

    let tocHovered = false;
    scrollableNavigation.addEventListener("mouseenter", debounced(() => (tocHovered = true)));
    scrollableNavigation.addEventListener("mouseleave", debounced(() => (tocHovered = false)));

    const scrollHandler = () => {
        const scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
        let newActiveSection: HTMLElement | undefined;

        sectionsOffsets.forEach((section) => {
            if (scrollPosition >= section.offset - 20) {
                newActiveSection = document.getElementById(section.id) ?? newActiveSection;
            }
        });

        const newActiveSectionLink = newActiveSection
            ? idToNavigationElement[newActiveSection.id]
            : undefined;

        if (newActiveSectionLink !== activeSectionLink) {
            if (activeSectionLink) activeSectionLink.classList.remove(activeClass);
            if (newActiveSectionLink) {
                newActiveSectionLink.classList.add(activeClass);
                if (!tocHovered) scrollToTocElement(newActiveSectionLink, scrollableNavigation);
            }
            activeSectionLink = newActiveSectionLink;
        }
    };

    window.addEventListener("scroll", debounced(scrollHandler));

    const resizeHandler = () => {
        sectionsOffsets = computeOffsets(headers);
        scrollHandler();
    };

    const articleContent = document.querySelector(".article-content");
    if (articleContent) {
        const resizeObserver = new ResizeObserver(debounced(resizeHandler));
        resizeObserver.observe(articleContent);
    }
    window.addEventListener("resize", debounced(resizeHandler));
}

export { setupScrollspy };
