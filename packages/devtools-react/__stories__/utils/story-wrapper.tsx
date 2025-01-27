import { RequestInstance } from "@hyper-fetch/core";

export const StoryWrapper = ({
  children,
  requests,
}: {
  children: React.ReactNode;
  requests: { request: RequestInstance; name: string }[];
}) => {
  return (
    <div>
      <div>
        {requests.map(({ name, request }) => (
          <button
            data-testid={`${name.toLowerCase().split(" ").join("-")}-button`}
            type="button"
            onClick={() => request.send()}
          >
            {name}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
};
