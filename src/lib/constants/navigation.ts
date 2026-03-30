import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  Factory,
  FileSpreadsheet,
  History,
  Layers,
  LayoutDashboard,
  Package,
  PackageOpen,
  Repeat,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  Workflow,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export const mainNav: NavItem[] = [
  {
    title: "Kokpit",
    href: "/kokpit",
    icon: LayoutDashboard,
    description: "Operasyon özeti",
  },
  {
    title: "Excel Aktarım",
    href: "/excel-aktarim",
    icon: FileSpreadsheet,
  },
  {
    title: "Aktarım Geçmişi",
    href: "/aktarim-gecmisi",
    icon: History,
  },
  {
    title: "Ana Parça Listesi",
    href: "/ana-parca-listesi",
    icon: Layers,
  },
  {
    title: "İş Atama / Planlama",
    href: "/is-atama",
    icon: Workflow,
  },
  {
    title: "Üretim Emirleri",
    href: "/uretim-emirleri",
    icon: Factory,
  },
  {
    title: "Montaj / Grup Takibi",
    href: "/montaj-grup-takibi",
    icon: ClipboardList,
  },
  {
    title: "Malzeme Yönetimi",
    href: "/malzeme-yonetimi",
    icon: Package,
  },
  {
    title: "Ham Maddeler",
    href: "/ham-maddeler",
    icon: Warehouse,
  },
  {
    title: "Sarf Malzemeler",
    href: "/sarf-malzemeler",
    icon: PackageOpen,
  },
  {
    title: "Tedarikçiler",
    href: "/tedarikciler",
    icon: Users,
  },
  {
    title: "Malzeme–Tedarikçi İlişkileri",
    href: "/malzeme-tedarikci",
    icon: ShoppingCart,
  },
  {
    title: "Stok Hareketleri",
    href: "/stok-hareketleri",
    icon: Truck,
  },
  {
    title: "Ürün Kartları",
    href: "/urun-kartlari",
    icon: Package,
  },
  {
    title: "Ürün Stoğu",
    href: "/urun-stogu",
    icon: Warehouse,
  },
  {
    title: "Sevkiyatlar",
    href: "/sevkiyatlar",
    icon: Truck,
  },
  {
    title: "Tekrar Eden İşler",
    href: "/tekrar-eden-isler",
    icon: Repeat,
  },
  {
    title: "Raporlama",
    href: "/raporlama",
    icon: BarChart3,
  },
  {
    title: "Firma / Sistem Ayarları",
    href: "/ayarlar",
    icon: Settings,
  },
];

export { brand } from "@/lib/constants/brand";
