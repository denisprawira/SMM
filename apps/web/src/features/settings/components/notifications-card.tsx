import { useSuspenseQuery } from '@tanstack/react-query'
import { Hash, MessageCircle } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_GROUPS,
  SLACK_CHANNELS,
  notificationsQueryOptions,
  useSetSlackChannel,
  useToggleNotification,
  type NotificationSettings,
} from '../api'
import { SettingsCardFooter, SettingsCardHeader } from './form'

/** Channel columns: 90px in Figma; narrower on phones so the event text keeps room. */
const CELL = 'flex w-[52px] shrink-0 justify-center md:w-[90px]'

/** Figma "Notification preferences" (28:4871): event × channel Switch matrix + Slack destination. */
export function NotificationsCard({ className }: { className?: string }) {
  const { data } = useSuspenseQuery(notificationsQueryOptions)
  const toggle = useToggleNotification()
  const [slackOpen, setSlackOpen] = useState(false)

  return (
    <section id="notifications" aria-labelledby="notifications-title" className={cn('scroll-mt-20 xl:scroll-mt-6', className)}>
      <Card>
        <SettingsCardHeader title={<span id="notifications-title">Notification preferences</span>} description="Choose what reaches you and where." />

        <div aria-hidden className="flex h-9 items-center gap-2 border-b bg-canvas px-5 text-caption font-medium text-tertiary md:gap-3">
          <span className="min-w-0 flex-1">Event</span>
          {NOTIFICATION_CHANNELS.map((c) => (
            <span key={c.id} className={CELL}>
              {c.label}
            </span>
          ))}
        </div>

        {NOTIFICATION_GROUPS.map((group) => (
          <Fragment key={group.id}>
            <h4 className="px-5 pt-3 pb-1 text-overline text-tertiary uppercase">{group.label}</h4>
            {data.events
              .filter((e) => e.group === group.id)
              .map((event) => (
                <div key={event.id} className="flex items-center gap-2 px-5 py-2 md:gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-px">
                    <p id={`notif-${event.id}`} className="text-body-sm font-medium text-foreground">
                      {event.title}
                    </p>
                    <p className="text-caption text-tertiary">{event.description}</p>
                  </div>
                  {NOTIFICATION_CHANNELS.map((c) => (
                    <span key={c.id} className={CELL}>
                      <Switch
                        checked={event.channels[c.id]}
                        onCheckedChange={(on) => toggle.mutate({ event, channel: c.id, on })}
                        aria-label={c.label}
                        aria-describedby={`notif-${event.id}`}
                      />
                    </span>
                  ))}
                </div>
              ))}
          </Fragment>
        ))}

        <SettingsCardFooter className="gap-2.5">
          <MessageCircle aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <p className="min-w-0 flex-1 text-body-sm text-muted-foreground md:truncate">
            Slack: posting to {data.slack.channel} in {data.slack.workspace}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSlackOpen(true)}>
            Change channel
          </Button>
        </SettingsCardFooter>
      </Card>

      <SlackChannelDialog open={slackOpen} onOpenChange={setSlackOpen} slack={data.slack} />
    </section>
  )
}

function SlackChannelDialog({ open, onOpenChange, slack }: { open: boolean; onOpenChange: (open: boolean) => void; slack: NotificationSettings['slack'] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">{open && <SlackChannelForm slack={slack} onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  )
}

function SlackChannelForm({ slack, onDone }: { slack: NotificationSettings['slack']; onDone: () => void }) {
  const setChannel = useSetSlackChannel()
  const [channel, setLocal] = useState(slack.channel)

  return (
    <>
      <DialogHeader className="pr-14">
        <DialogTitle>Slack channel</DialogTitle>
        <DialogDescription>Where Relay posts notifications in {slack.workspace}.</DialogDescription>
      </DialogHeader>
      <RadioGroup value={channel} onValueChange={setLocal} aria-label="Slack channel" className="gap-2 px-6 pt-5">
        {SLACK_CHANNELS.map((c) => (
          <label
            key={c.value}
            htmlFor={`slack-${c.value.slice(1)}`}
            className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-subtle has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary-subtle/50"
          >
            <RadioGroupItem id={`slack-${c.value.slice(1)}`} value={c.value} />
            <Hash aria-hidden className="size-4 shrink-0 text-tertiary" />
            <span className="flex min-w-0 flex-col gap-px">
              <span className="text-body-sm font-medium text-foreground">{c.value.slice(1)}</span>
              <span className="text-caption text-tertiary">{c.description}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button
          disabled={channel === slack.channel}
          onClick={() => {
            setChannel.mutate(channel)
            onDone()
          }}
        >
          Save channel
        </Button>
      </DialogFooter>
    </>
  )
}
