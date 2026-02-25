import { useNav } from "./NavigationContext.js"
import Home from "../screens/Home.jsx"
import AddPassage from "../screens/AddPassage.jsx"
import PassageHome from "../screens/PassageHome.jsx"
import ChunkScreen from "../screens/ChunkScreen.jsx"
import CumulativeReview from "../screens/CumulativeReview.jsx"
import GameScreen from "../screens/GameScreen.jsx"

export default function Router() {
  const { screen, params } = useNav()

  switch (screen) {
    case "home":
      return <Home />
    case "add":
      return <AddPassage />
    case "passage":
      return <PassageHome passageId={params.passageId} />
    case "chunk":
      return <ChunkScreen passageId={params.passageId} chunkIndex={params.chunkIndex} />
    case "cumulative":
      return (
        <CumulativeReview
          passageId={params.passageId}
          reviewIndex={params.reviewIndex}
          isFinal={params.isFinal}
        />
      )
    case "game":
      return <GameScreen {...params} />
    default:
      return <Home />
  }
}
