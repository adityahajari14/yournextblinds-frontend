const TopBar = () => {
  return (
    <div className="bg-[#f3f3f3] backdrop-blur-sm px-4 md:px-6 lg:px-20 py-2.5 flex items-center justify-center md:justify-between">
      <p className="text-xs text-black tracking-wide text-center md:text-left">
        Toll Free: 1800 245 2525
      </p>
      <div className="hidden md:flex gap-8 lg:gap-14 items-center">
        <a href="/contact" className="text-xs text-black underline hover:opacity-70 transition-opacity">
          Get Help
        </a>
        <a href="/guides" className="text-xs text-black underline hover:opacity-70 transition-opacity">
          Measure Size
        </a>
        <a href="/samples" className="text-xs text-black underline hover:opacity-70 transition-opacity">
          Free Sample
        </a>
        <a href="/account" className="text-xs text-black underline hover:opacity-70 transition-opacity">
          Track an Order
        </a>
      </div>
    </div>
  );
};

export default TopBar;
