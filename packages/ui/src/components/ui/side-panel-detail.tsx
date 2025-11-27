import { PropsWithChildren } from 'react'

type ItemProps = PropsWithChildren<{
  title: string
}>

export const SidePanelDetail: React.FC<PropsWithChildren> = ({ children }) => {
  return <table className="w-full">{children}</table>
}

export const SidePanelDetailItem: React.FC<ItemProps> = ({ title, children }) => {
  return (
    <tr>
      <td className="text-md min-w-[100px] font-medium">{title}</td>
      <td className="py-2 text-muted-foreground font-medium">{children}</td>
    </tr>
  )
}

SidePanelDetail.displayName = 'SidePanelDetail'
SidePanelDetailItem.displayName = 'SidePanelDetailItem'
