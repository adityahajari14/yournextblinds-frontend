export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="px-4 md:px-6 lg:px-20 py-8">
        <div className="max-w-[1400px] mx-auto animate-pulse">
          <div className="h-4 w-48 bg-gray-200 rounded mb-8" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/2">
              <div className="aspect-square bg-gray-200 rounded-lg" />
            </div>
            <div className="lg:w-1/2 space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 rounded" />
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-40 w-full bg-gray-200 rounded-lg" />
              <div className="h-12 w-full bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
