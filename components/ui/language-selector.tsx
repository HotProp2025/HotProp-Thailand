import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/language-context";
import globeIcon from "@assets/IMG_3164_1756545440708.png";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          data-testid="button-language-selector"
        >
          <img src={globeIcon} alt="Globe" className="h-4 w-4" />
          {language === 'en' ? 'EN' : 'TH'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className={language === 'en' ? 'bg-hotprop-primary/10' : ''}
          data-testid="language-english"
        >
          <span className="mr-2">🇺🇸</span>
          {t('language.english')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('th')}
          className={language === 'th' ? 'bg-hotprop-primary/10' : ''}
          data-testid="language-thai"
        >
          <span className="mr-2">🇹🇭</span>
          {t('language.thai')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}