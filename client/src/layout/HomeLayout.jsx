import { Logo } from "../components/Logo"
import { NavBar } from "../components/NavBar"
import { FiltroNavBar } from "../filtro/FiltroNavBar";
import "./homeLayout.css";

export const HomeLayout = ({active, title}) => {
  return (
    <div>
      <NavBar active={active} />
      <Logo />
      <FiltroNavBar />
      <h1 className="title">{title}</h1>
    </div>
  )
}
