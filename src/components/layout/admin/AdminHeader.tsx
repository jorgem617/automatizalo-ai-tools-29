import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Eye, Home, LogOut } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminNavItem } from './AdminNavItem';
import { AdminRouteType } from './types';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';
import { adminTranslations } from '@/translations/adminTranslations';
import { useNavigate } from 'react-router-dom';
import { useAdminRouteState } from './useAdminRouteState';

interface AdminHeaderProps {
  onHomeClick: () => void;
  onLogout: () => void;
  onViewAsClient: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  onHomeClick,
  onLogout,
  onViewAsClient
}) => {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { activeTab, adminRoutes, handleTabChange } = useAdminRouteState();
  
  const t = adminTranslations[language]?.adminHeader || {
    adminTitle: 'Panel Principal',
    navigation: 'Navigation',
    viewAsClient: 'Client View',
    home: 'Home',
    logout: 'Logout'
  };

  // Sort routes by priority for menu view
  const sortedRoutes = [...adminRoutes].sort((a, b) => 
    (b.priority ?? 0) - (a.priority ?? 0)
  );

  return (
    <div className="bg-white shadow sticky top-0 z-50">
      <div className="px-4 h-16 flex justify-between items-center">
        <div className="flex-shrink-0 flex items-center">
          <h1 
            className="text-lg font-bold cursor-pointer" 
            onClick={() => navigate('/admin')}
          >
            {t.adminTitle}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mostrar LanguageSwitcher en la barra superior solo en modo desktop */}
          {!isMobile && <LanguageSwitcher />}
          
          {/* Mostrar botones de acción en la barra superior solo en modo desktop */}
          {!isMobile && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewAsClient}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">{t.viewAsClient}</span>
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={onHomeClick}
              >
                <Home className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t.home}</span>
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t.logout}</span>
              </Button>
            </>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 z-50">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>{t.navigation}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col py-2 overflow-y-auto max-h-[calc(100vh-80px)]">
                {sortedRoutes.map((route) => (
                  <SheetClose asChild key={route.value}>
                    <AdminNavItem
                      route={route}
                      isActive={activeTab === route.value}
                      onClick={() => handleTabChange(route.value)}
                    />
                  </SheetClose>
                ))}
                
                {/* Mostrar controles en el menú lateral solo en modo mobile */}
                {isMobile && (
                  <div className="px-4 py-2 mt-4 border-t">
                    <div className="mb-4">
                      <LanguageSwitcher />
                    </div>
                    
                    <SheetClose asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={onViewAsClient}
                        className="w-full flex items-center justify-start gap-2 mb-2"
                      >
                        <Eye className="h-4 w-4" />
                        {t.viewAsClient}
                      </Button>
                    </SheetClose>
                    
                    <SheetClose asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={onHomeClick}
                        className="w-full flex items-center justify-start gap-2 mb-2"
                      >
                        <Home className="h-4 w-4" />
                        {t.home}
                      </Button>
                    </SheetClose>
                    
                    <SheetClose asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={onLogout}
                        className="w-full flex items-center justify-start gap-2 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {t.logout}
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default memo(AdminHeader);
