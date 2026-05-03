export function generateStaticParams() {
    return [{ locale: "pt-BR" }, { locale: "en" }, { locale: "es" }];
}

export default function Test2Page() {
    return (
        <div>
            <h1>Test2 Page</h1>
            <p>This is inside [locale] route group.</p>
        </div>
    );
}
