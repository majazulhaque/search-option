import { useEffect, useRef, useState } from "react";

const STATE = {
  LOADING: "LOADING",
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
};

export default function TypeAhead() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [status, setStatus] = useState(STATE.LOADING);
  const cache = useRef({});

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
  };

  console.log(cache);

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const fetchData = async () => {
      setStatus(STATE.LOADING);
      try {
        if (cache.current[query]) {
          console.log("Retreived from cache");
          setData(cache.current[query]);
          cache.current[query].count++;
          return;
        }
        // Evict cache entry with lowest count if size exceeds 10
        const cacheKeys = Object.keys(cache.current);
        console.log(cacheKeys);
        if (cacheKeys.length >= 10) {
          let minKey = cacheKeys[0];
          for (let key of cacheKeys) {
            if (cache.current[key].count < cache.current[minKey].count) {
              minKey = key;
            }
          }
          console.log(`Evicting cache for: ${minKey}`);
          delete cache.current[minKey];
        }
        console.log("API CALL");
        const response = await fetch(
          `https://dummyjson.com/products/search?q=${query}`,
          {
            signal,
          }
        );
        const responseData = await response.json();
        setData(responseData.products);
        cache.current[query] = { data: responseData.products, count: 0 };
      } catch (error) {
        console.log(error);
        if (error.name !== "AbortError") {
          setStatus(STATE.ERROR);
        }
      } finally {
        setStatus(STATE.SUCCESS);
      }
    };
    const interval = setTimeout(fetchData, 1000);
    return () => {
      clearTimeout(interval);
      abortController.abort();
    };
  }, [query]);

  return (
    <div className="type-ahead-container">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search Something..."
      />
      {status === STATE.SUCCESS && (
        <div className="list-container">
          {data?.slice(0, 10)?.map((item) => {
            return <span key={item?.id}>{item?.title}</span>;
          })}
        </div>
      )}
      {status === STATE.LOADING && <div>Loading...</div>}
      {status === STATE.ERROR && <div>error</div>}
    </div>
  );
}
