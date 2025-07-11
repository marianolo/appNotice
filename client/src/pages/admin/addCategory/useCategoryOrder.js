import { useEffect, useState } from "react"

export const useCategoryOrder = () => {

  const [ orderId, setOrderId ] = useState(JSON.parse(localStorage.getItem("orderId")));
  const [ orderName, setOrderName ] = useState(JSON.parse(localStorage.getItem("orderName")));

  const [ priority, setPriority ] = useState(localStorage.getItem("priority"))

  useEffect(() => {
    localStorage.setItem("orderId", orderId);
  }, [orderId])

  useEffect(() => {
    localStorage.setItem("orderName", orderName);
  }, [orderName]);

  useEffect(() => {
    localStorage.setItem("priority", priority);
  }, [priority])

  return {
    orderId,
    setOrderId,
    orderName,
    setOrderName,
    setPriority,
  }
  
}
