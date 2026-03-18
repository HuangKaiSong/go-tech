import { useAuth } from "@/hooks/use-auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@go-tech-frontend/ui";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminHeader = () => {
  const navigate = useNavigate();
  const { user, setToken } = useAuth();
  if (!user) {
    return null;
  }

  const handleLogout = () => {
    setToken(undefined);
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-end px-6">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.icon} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user.sub?.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">
            {user.nickname}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem>
            <User className="w-4 h-4 mr-2" />
            個人資料
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            登出
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default AdminHeader;
