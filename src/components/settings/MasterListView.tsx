import { MasterDataItem, isProjectType } from "./masterTypes";

export default function MasterListView({
  items,
}: {
  items: MasterDataItem[];
}) {
  return (
    <div className="max-h-80 overflow-y-auto rounded border border-gray-200">
      {items.length > 0 ? (
        items.map((item) => (
          <div
            key={item.id}
            className="border-b border-gray-100 px-4 py-2 text-sm text-gray-800 last:border-b-0"
          >
            {isProjectType(item) ? (
              <span>
                <b>{item.code}</b>：{item.name}
              </span>
            ) : (
              <span>{item.name}</span>
            )}
          </div>
        ))
      ) : (
        <p className="px-4 py-3 text-sm text-gray-500">
          登録データがありません。
        </p>
      )}
    </div>
  );
}