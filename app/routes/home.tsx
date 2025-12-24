import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Union Simple" },
    { name: "description", content: "Union management made simple" },
  ];
}

export function loader() {
  return new Response(
    JSON.stringify({ message: "Welcome to Union Simple" }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Union Simple
        </h1>
        <p className="text-lg text-gray-600">
          Your union management platform
        </p>
      </div>
    </div>
  );
}

