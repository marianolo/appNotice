import { HomeLayout } from "../../layout/HomeLayout"
import { Filtro } from "../Filtro"
import { useFiltro } from "../useFiltro"

export const FiltroPage = () => {

  const { noticia } = useFiltro({});

  return (
    <div>
      <HomeLayout />
      <Filtro noticia={noticia} />
    </div>
  )
}
