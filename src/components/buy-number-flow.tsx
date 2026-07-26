"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, LoaderCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/money";

type Service = {
  service_code: number;
  service_name: string;
  service_img: string;
};

type Price = {
  provider_id: string;
  stock: number;
  price: number;
  available: boolean;
};

type Country = {
  number_id: number;
  name: string;
  img: string;
  prefix: string;
  iso_code: string;
  stock_total: number;
  pricelist: Price[];
};

type Operator = {
  id: number;
  name: string;
  image: string;
};

type PricePreview = {
  costPrice: string;
  profitAmount: string;
  sellingPrice: string;
  stock: number;
};

type CreatedOrder = {
  id: string;
  phoneNumber: string;
  status: string;
  sellingPrice: string;
};

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json();

  if (!response.ok || !body.success) {
    throw new Error(body.error?.message ?? "Permintaan gagal");
  }

  return body.data as T;
}

export function BuyNumberFlow() {
  const [services, setServices] = useState<Service[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [service, setService] = useState<Service>();
  const [country, setCountry] = useState<Country>();
  const [price, setPrice] = useState<Price>();
  const [operator, setOperator] = useState<Operator>();
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<PricePreview>();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<CreatedOrder>();

  useEffect(() => {
    let active = true;

    api<Service[]>("/api/services")
      .then((data) => {
        if (active) setServices(data);
      })
      .catch((error: Error) => toast.error(error.message));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!service) return;
    let active = true;

    api<Country[]>(`/api/countries?serviceId=${service.service_code}`)
      .then((data) => {
        if (active) setCountries(data);
      })
      .catch((error: Error) => toast.error(error.message));

    return () => {
      active = false;
    };
  }, [service]);

  useEffect(() => {
    if (!service || !country || !price) return;
    let active = true;

    const operatorRequest = api<Operator[]>(
      `/api/operators?country=${encodeURIComponent(country.name)}&providerId=${encodeURIComponent(price.provider_id)}`,
    );
    const previewRequest = api<PricePreview>(
      `/api/price-preview?serviceCode=${service.service_code}&serviceName=${encodeURIComponent(service.service_name)}&country=${encodeURIComponent(country.name)}&countryIso=${country.iso_code}&numberId=${country.number_id}&providerId=${price.provider_id}`,
    );

    Promise.all([operatorRequest, previewRequest])
      .then(([operatorData, previewData]) => {
        if (!active) return;
        setOperators(operatorData);
        setPreview(previewData);
      })
      .catch((error: Error) => toast.error(error.message));

    return () => {
      active = false;
    };
  }, [country, price, service]);

  const filtered = useMemo(
    () =>
      services.filter((item) =>
        item.service_name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, services],
  );

  function selectService(item: Service) {
    setService(item);
    setCountry(undefined);
    setPrice(undefined);
    setOperator(undefined);
    setCountries([]);
    setOperators([]);
    setPreview(undefined);
  }

  function selectCountry(item: Country) {
    const availablePrice = item.pricelist.find(
      (provider) => provider.available && provider.stock > 0,
    );

    setCountry(item);
    setPrice(availablePrice);
    setOperator(undefined);
    setOperators([]);
    setPreview(undefined);

    if (!availablePrice) {
      toast.error("Stok provider untuk negara ini sedang kosong");
    }
  }

  async function checkout() {
    if (!service || !country || !price || !operator) return;

    setLoading(true);
    try {
      const result = await api<CreatedOrder>("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCode: service.service_code,
          serviceName: service.service_name,
          country: country.name,
          countryIso: country.iso_code,
          numberId: country.number_id,
          providerId: price.provider_id,
          operatorId: operator.id,
          operatorName: operator.name,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      setOrder(result);
      toast.success("Nomor berhasil dipesan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout gagal");
    } finally {
      setLoading(false);
    }
  }

  if (order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nomor berhasil diterima</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl bg-[var(--muted)] p-6">
            <p className="text-sm text-[var(--muted-foreground)]">
              Nomor virtual
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-2xl font-black">{order.phoneNumber}</p>
              <Button
                variant="outline"
                size="icon"
                aria-label="Salin nomor virtual"
                onClick={() => navigator.clipboard.writeText(order.phoneNumber)}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Status OTP diperiksa melalui backend. Buka halaman Pesanan Aktif untuk
            melihat kode terbaru.
          </p>
          <Button asChild>
            <a href={`/dashboard/orders/${order.id}`}>Lihat pesanan</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Pilih aplikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3.5 size-4 text-[var(--muted-foreground)]" />
              <Input
                className="pl-10"
                placeholder="Cari WhatsApp, Telegram..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <button
                  key={item.service_code}
                  type="button"
                  onClick={() => selectService(item)}
                  className={`rounded-xl border p-4 text-left transition ${
                    service?.service_code === item.service_code
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "hover:bg-[var(--muted)]"
                  }`}
                >
                  <p className="font-bold">{item.service_name}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Kode layanan disembunyikan saat checkout
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {service && (
          <Card>
            <CardHeader>
              <CardTitle>2. Pilih negara dan provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {countries.map((item) => (
                  <button
                    key={item.number_id}
                    type="button"
                    onClick={() => selectCountry(item)}
                    className={`rounded-xl border p-4 text-left ${
                      country?.number_id === item.number_id
                        ? "border-indigo-500"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {item.prefix} • stok {item.stock_total}
                        </p>
                      </div>
                      {country?.number_id === item.number_id && (
                        <Check className="size-5 text-indigo-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {country && price && (
          <Card>
            <CardHeader>
              <CardTitle>3. Pilih operator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {operators.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOperator(item)}
                    className={`rounded-xl border p-4 text-left ${
                      operator?.id === item.id
                        ? "border-indigo-500 bg-indigo-500/10"
                        : ""
                    }`}
                  >
                    <p className="font-bold capitalize">{item.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <aside>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Ringkasan pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Summary label="Aplikasi" value={service?.service_name} />
            <Summary label="Negara" value={country?.name} />
            <Summary label="Operator" value={operator?.name} />
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Harga modal</span>
                <span className="text-[var(--muted-foreground)]">
                  Disembunyikan
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-black">
                  {preview ? formatRupiah(preview.sellingPrice) : "-"}
                </span>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!operator || !preview || loading}
              onClick={checkout}
            >
              {loading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" /> Memesan...
                </>
              ) : (
                "Konfirmasi dan beli"
              )}
            </Button>
            <p className="text-xs leading-5 text-[var(--muted-foreground)]">
              Harga dan stok diperiksa ulang oleh server. Saldo tidak dapat
              dimanipulasi dari browser.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function Summary({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="font-semibold capitalize">
        {value ?? "Belum dipilih"}
      </span>
    </div>
  );
}
