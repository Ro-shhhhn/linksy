import InputForm from "../components/InputForm";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div>
        <h1 className="text-3xl font-bold text-center mb-6">LinkSy 🔗</h1>
        <InputForm />
      </div>
    </div>
  );
}
