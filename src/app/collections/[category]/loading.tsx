export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="px-4 md:px-6 lg:px-20 py-8">
        <div className="max-w-[1400px] mx-auto animate-pulse">
          <div className="h-40 bg-gray-200 rounded-lg mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-gray-200 rounded-lg" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
