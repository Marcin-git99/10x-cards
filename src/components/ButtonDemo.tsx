import { Button } from "@/components/ui/button";

export default function ButtonDemo() {
  const handleClick = () => {
    window.location.href = '/generate';
  };

  return (
    <div className="grid place-items-center h-screen content-center gap-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">10x Cards</h1>
        <p className="text-lg text-gray-600 max-w-md">
          Generuj fiszki do nauki przy pomocy sztucznej inteligencji
        </p>
        <Button onClick={handleClick} size="lg" className="mt-6">
          Rozpocznij generowanie fiszek
        </Button>
      </div>
    </div>
  );
}
