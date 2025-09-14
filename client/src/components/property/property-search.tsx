import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";

interface PropertySearchProps {
  onSearch: (query: string) => void;
  onFilterClick: () => void;
}

export default function PropertySearch({ onSearch, onFilterClick }: PropertySearchProps) {
  const [query, setQuery] = useState("");
  const { t } = useLanguage();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="px-4 py-4 bg-white border-b">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-hotprop-primary border-0"
        />
        <Button 
          type="button"
          onClick={onFilterClick}
          size="sm"
          className="absolute right-3 top-2 bg-hotprop-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-hotprop-primary/90"
        >
          <Filter className="w-3 h-3 mr-1" />
          {t('search.filterButton')}
        </Button>
      </form>
    </div>
  );
}
