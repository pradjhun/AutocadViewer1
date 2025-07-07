export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-cube text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">AutoCAD Web Viewer</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-slate-600 hover:text-slate-900 font-medium">Files</a>
            <a href="#" className="text-slate-600 hover:text-slate-900 font-medium">Settings</a>
            <a href="#" className="text-slate-600 hover:text-slate-900 font-medium">Help</a>
          </nav>
        </div>
      </div>
    </header>
  );
}
