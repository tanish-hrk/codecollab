interface Collaborator {
  id: string
  name: string
  email: string
  online: boolean
}

interface CollaboratorsListProps {
  collaborators: Collaborator[]
}

export default function CollaboratorsList({ collaborators }: CollaboratorsListProps) {
  const onlineCollaborators = collaborators.filter((c) => c.online)
  const offlineCollaborators = collaborators.filter((c) => !c.online)

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Collaborators</h2>
      <div className="space-y-4">
        <div>
          <h3 className="mb-1 text-sm font-medium text-muted-foreground">Online ({onlineCollaborators.length})</h3>
          <div className="space-y-1">
            {onlineCollaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent/50"
              >
                <div className="relative h-6 w-6 rounded-full bg-primary/10 text-center text-xs leading-6">
                  {collaborator.name.charAt(0)}
                  <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-1 ring-white" />
                </div>
                <span>{collaborator.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-1 text-sm font-medium text-muted-foreground">Offline ({offlineCollaborators.length})</h3>
          <div className="space-y-1">
            {offlineCollaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent/50"
              >
                <div className="h-6 w-6 rounded-full bg-muted text-center text-xs leading-6">
                  {collaborator.name.charAt(0)}
                </div>
                <span className="text-muted-foreground">{collaborator.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

