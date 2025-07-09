import { Loader2 } from "lucide-react";

export const Table = ({ data, loading }: { data: Record<string, any>[]; loading?: boolean }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200/10 rounded-md bg-gray-500/10 w-full">
        <h5 className="text-lg font-bold">Empty</h5>
        <div className="text-center text-gray-600">There is no data to display</div>
      </div>
    );
  }

  const headers = Object.keys(data[0]);

  return (
    <table className="w-full">
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} className="uppercase text-xs text-gray-500">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            {headers.map((header) => (
              <td key={header}>{row[header]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
