import { Input } from "@workspace/ui";
import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="mb-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <Input
          placeholder="Search..."
          className="pl-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 h-12"
        />
      </div>
    </div>
  );
}
