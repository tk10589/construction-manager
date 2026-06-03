"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [userName, setUserName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setError("");

    if (
      !loginId.trim() ||
      !password.trim() ||
      !companyName.trim() ||
      !userName.trim() ||
      !email.trim()
    ) {
      setError("必須項目を入力してください");
      return;
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginId,
          password,
          companyName,
          userName,
          address,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "新規登録に失敗しました");
        return;
      }

      alert("登録が完了しました。ログインしてください。");
      router.push("/login");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">
          新規登録
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          施工管理アプリの利用登録を行います。
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              ログインID <span className="text-red-500">*</span>
            </label>
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              placeholder="例：sample-user"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              placeholder="8文字以上"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              会社名 <span className="text-red-500">*</span>
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              placeholder="例：株式会社サンプル"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              担当者名 <span className="text-red-500">*</span>
            </label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              placeholder="例：田中 太郎"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              住所・地域
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              placeholder="例：宮城県仙台市"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
              placeholder="例：sample@example.com"
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={isLoading}
            className={`w-full rounded-lg px-4 py-2 font-bold text-white ${
              isLoading
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "登録中..." : "登録する"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => router.push("/login")}
            className="text-blue-600 hover:underline"
          >
            ログイン画面へ戻る
          </button>
        </div>
      </div>
    </main>
  );
}