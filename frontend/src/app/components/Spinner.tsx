export const Spinner = () => {
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-l-2 border-current">
      <span className="sr-only">Loading...</span>
    </div>
  );
};
