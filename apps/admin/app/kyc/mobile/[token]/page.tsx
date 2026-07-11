import KycMobileClient from "./kyc-mobile-client";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <KycMobileClient token={token} />;
}
