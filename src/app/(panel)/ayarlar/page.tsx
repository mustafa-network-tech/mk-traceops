import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  companyRepository,
  departmentRepository,
  locationRepository,
  userRepository,
} from "@/lib/repositories";

export default function AyarlarPage() {
  const companies = companyRepository.getAll();
  const departments = departmentRepository.getAll();
  const locations = locationRepository.getAll();
  const users = userRepository.getAll();

  return (
    <div>
      <PageHeader
        title="Firma / sistem ayarları"
        description="Şirket, bölüm, depo konumları ve kullanıcı örnekleri. V1 mock — ileride Supabase kimlik ve çoklu şirket yapılandırması bağlanacak."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Ayarlar" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Firma bilgisi (örnek form)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Ticari unvan</Label>
              <Input readOnly className="bg-slate-50" value="Örnek Üretim A.Ş." />
            </div>
            <div className="space-y-1.5">
              <Label>Vergi no</Label>
              <Input readOnly className="bg-slate-50" value="0000000000" />
            </div>
            <div className="space-y-1.5">
              <Label>Varsayılan para birimi</Label>
              <Input readOnly className="bg-slate-50" value="TRY" />
            </div>
            <div className="space-y-1.5">
              <Label>Notlar</Label>
              <Textarea
                readOnly
                className="bg-slate-50"
                value="Supabase projesi ve RLS politikaları eklendiğinde bu ekran yapılandırma API’sine bağlanır."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Üretim ortakları / firmalar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Şehir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-xs">
                      {c.isExternalManufacturer ? "Dış işlem" : "İç"}
                    </TableCell>
                    <TableCell>{c.city ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bölümler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Ad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.code}</TableCell>
                    <TableCell>{d.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Depo / konum</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Tip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.code}</TableCell>
                    <TableCell>{l.name}</TableCell>
                    <TableCell className="text-xs">{l.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Kullanıcılar (mock)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
