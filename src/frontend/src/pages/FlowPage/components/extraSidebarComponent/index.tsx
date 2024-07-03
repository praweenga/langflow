import { cloneDeep } from "lodash";
import { LinkIcon, SparklesIcon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import IconComponent from "../../../../components/genericIconComponent";
import ShadTooltip from "../../../../components/shadTooltipComponent";
import { Input } from "../../../../components/ui/input";
import { Separator } from "../../../../components/ui/separator";
import { PRIORITY_SIDEBAR_ORDER } from "../../../../constants/constants";
import ExportModal from "../../../../modals/exportModal";
import ShareModal from "../../../../modals/shareModal";
import useAlertStore from "../../../../stores/alertStore";
import useFlowStore from "../../../../stores/flowStore";
import useFlowsManagerStore from "../../../../stores/flowsManagerStore";
import { useStoreStore } from "../../../../stores/storeStore";
import { useTypesStore } from "../../../../stores/typesStore";
import { APIClassType, APIObjectType } from "../../../../types/api";
import {
  nodeColors,
  nodeIconsLucide,
  nodeNames,
} from "../../../../utils/styleUtils";
import { classNames, removeCountFromString } from "../../../../utils/utils";
import DisclosureComponent from "../DisclosureComponent";
import ParentDisclosureComponent from "../ParentDisclosureComponent";
import SidebarDraggableComponent from "./sideBarDraggableComponent";
import { sortKeys } from "./utils";
import sensitiveSort from "./utils/sensitive-sort";

export default function ExtraSidebar(): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(true);
  const data = useTypesStore((state) => state.data);
  const templates = useTypesStore((state) => state.templates);
  const getFilterEdge = useFlowStore((state) => state.getFilterEdge);
  const setFilterEdge = useFlowStore((state) => state.setFilterEdge);
  const currentFlow = useFlowsManagerStore((state) => state.currentFlow);
  const hasStore = useStoreStore((state) => state.hasStore);
  const hasApiKey = useStoreStore((state) => state.hasApiKey);
  const validApiKey = useStoreStore((state) => state.validApiKey);

  const setErrorData = useAlertStore((state) => state.setErrorData);
  const [dataFilter, setFilterData] = useState(data);
  const [search, setSearch] = useState("");

  function onDragStart(
    event: React.DragEvent<any>,
    data: { type: string; node?: APIClassType },
  ): void {
    var crt = event.currentTarget.cloneNode(true);
    crt.style.position = "absolute";
    crt.style.top = "-500px";
    crt.style.right = "-500px";
    crt.classList.add("cursor-grabbing");
    document.body.appendChild(crt);
    event.dataTransfer.setDragImage(crt, 0, 0);
    event.dataTransfer.setData("nodedata", JSON.stringify(data));
  }

  function handleSearchInput(e: string) {
    if (e === "") {
      setFilterData(data);
      return;
    }
    setFilterData((_) => {
      let ret = {};
      Object.keys(data).forEach((d: keyof APIObjectType) => {
        ret[d] = {};
        let keys = Object.keys(data[d]).filter(
          (nd) =>
            nd.toLowerCase().includes(e.toLowerCase()) ||
            data[d][nd].display_name?.toLowerCase().includes(e.toLowerCase()),
        );
        keys.forEach((element) => {
          ret[d][element] = data[d][element];
        });
      });
      return ret;
    });
  }

  useEffect(() => {
    let errors: string[] = [];
    Object.keys(templates).forEach((component) => {
      if (templates[component].error) {
        errors.push(component);
      }
    });
    if (errors.length > 0)
      setErrorData({ title: " Components with errors: ", list: errors });
  }, []);

  function handleBlur() {
    if ((!search && search === "") || search === "search") {
      setFilterData(data);
      setFilterEdge([]);
      setSearch("");
    }
  }

  useEffect(() => {
    if (getFilterEdge.length !== 0) {
      setSearch("");
    }

    if (getFilterEdge.length === 0 && search === "") {
      setSearch("");
      setFilterData(data);
    }
  }, [getFilterEdge, data]);

  useEffect(() => {
    handleSearchInput(search);
  }, [data]);

  useEffect(() => {
    if (getFilterEdge?.length > 0) {
      setFilterData((_) => {
        let dataClone = cloneDeep(data);
        let ret = {};
        Object.keys(dataClone).forEach((d: keyof APIObjectType) => {
          ret[d] = {};
          if (getFilterEdge.some((x) => x.family === d)) {
            ret[d] = dataClone[d];

            const filtered = getFilterEdge
              .filter((x) => x.family === d)
              .pop()
              .type.split(",");

            for (let i = 0; i < filtered.length; i++) {
              filtered[i] = filtered[i].trimStart();
            }

            if (filtered.some((x) => x !== "")) {
              let keys = Object.keys(dataClone[d]).filter((nd) =>
                filtered.includes(nd),
              );
              Object.keys(dataClone[d]).forEach((element) => {
                if (!keys.includes(element)) {
                  delete ret[d][element];
                }
              });
            }
          }
        });
        setSearch("");
        return ret;
      });
    }
  }, [getFilterEdge, data]);

  const ModalMemo = useMemo(
    () => (
      <ShareModal
        is_component={false}
        component={currentFlow!}
        disabled={!hasApiKey || !validApiKey || !hasStore}
      >
        <button
          disabled={!hasApiKey || !validApiKey || !hasStore}
          className={classNames(
            "extra-side-bar-buttons gap-[4px] text-sm font-semibold",
            !hasApiKey || !validApiKey || !hasStore
              ? "button-disable cursor-default text-muted-foreground"
              : "",
          )}
        >
          <IconComponent
            name="Share3"
            className={classNames(
              "-m-0.5 -ml-1 h-6 w-6",
              !hasApiKey || !validApiKey || !hasStore
                ? "extra-side-bar-save-disable"
                : "",
            )}
          />
          Share
        </button>
      </ShareModal>
    ),
    [hasApiKey, validApiKey, currentFlow, hasStore],
  );

  const ExportMemo = useMemo(
    () => (
      <ExportModal>
        <button className={classNames("extra-side-bar-buttons")}>
          <IconComponent name="FileDown" className="side-bar-button-size" />
        </button>
      </ExportModal>
    ),
    [],
  );

  const getIcon = useMemo(() => {
    return (SBSectionName: string) => {
      if (nodeIconsLucide[SBSectionName]) {
        return (
          <IconComponent
            name={SBSectionName}
            strokeWidth={1.5}
            className="w-[22px] text-primary"
          />
        );
      }
    };
  }, []);

  return (
    <div
      className={`side-bar-arrangement transition-all duration-300 ${isExpanded ? "w-64" : "w-16"}`}
    >
      <div className="flex justify-end p-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <IconComponent
            name={isExpanded ? "ChevronLeft" : "ChevronRight"}
            className="h-5 w-5"
          />
        </button>
      </div>
      {isExpanded && (
        <>
          <div className="side-bar-search-div-placement">
            <Input
              value={search}
              type="text"
              name="search"
              id="search"
              placeholder="Search"
              className="nopan nodelete nodrag noundo nocopy input-search"
              onChange={(event) => {
                handleSearchInput(event.target.value);
                setSearch(event.target.value);
              }}
              onFocus={() => handleBlur()}
              autoComplete="off"
            />
            <div
              className="search-icon"
              onClick={() => {
                if (search) {
                  setFilterData(data);
                  setSearch("");
                }
              }}
            >
              <IconComponent
                name={search ? "X" : "Search"}
                className={`h-5 w-5 stroke-[1.5] text-primary ${
                  search ? "cursor-pointer" : "cursor-default"
                }`}
                aria-hidden="true"
              />
            </div>
          </div>
          <Separator />
        </>
      )}
      <div
        className={`side-bar-components-div-arrangement ${isExpanded ? "" : "items-center"}`}
      >
        <div className="parent-disclosure-arrangement">
          {isExpanded && (
            <div className="flex items-center gap-4 align-middle">
              <span className="parent-disclosure-title">Components</span>
            </div>
          )}
        </div>
        {Object.keys(dataFilter)
          .sort(sortKeys)
          .filter((x) => PRIORITY_SIDEBAR_ORDER.includes(x))
          .map((SBSectionName: keyof APIObjectType, index) =>
            Object.keys(dataFilter[SBSectionName]).length > 0 ? (
              <React.Fragment
                key={index + search + JSON.stringify(getFilterEdge)}
              >
                {isExpanded ? (
                  <DisclosureComponent
                    defaultOpen={
                      getFilterEdge.length !== 0 || search.length !== 0
                    }
                    isChild={false}
                    button={{
                      title: nodeNames[SBSectionName] ?? nodeNames.unknown,
                      Icon:
                        nodeIconsLucide[SBSectionName] ??
                        nodeIconsLucide.unknown,
                    }}
                  >
                    <div className="side-bar-components-gap">
                      {Object.keys(dataFilter[SBSectionName])
                        .sort((a, b) =>
                          sensitiveSort(
                            dataFilter[SBSectionName][a].display_name,
                            dataFilter[SBSectionName][b].display_name,
                          ),
                        )
                        .map((SBItemName: string, index) => (
                          <ShadTooltip
                            content={
                              dataFilter[SBSectionName][SBItemName].display_name
                            }
                            side="right"
                            key={index}
                          >
                            <SidebarDraggableComponent
                              sectionName={SBSectionName as string}
                              apiClass={dataFilter[SBSectionName][SBItemName]}
                              key={index + SBItemName}
                              onDragStart={(event) =>
                                onDragStart(event, {
                                  type: removeCountFromString(SBItemName),
                                  node: dataFilter[SBSectionName][SBItemName],
                                })
                              }
                              color={nodeColors[SBSectionName]}
                              itemName={SBItemName}
                              error={
                                !!dataFilter[SBSectionName][SBItemName].error
                              }
                              display_name={
                                dataFilter[SBSectionName][SBItemName]
                                  .display_name
                              }
                              official={
                                dataFilter[SBSectionName][SBItemName]
                                  .official !== false
                              }
                            />
                          </ShadTooltip>
                        ))}
                    </div>
                  </DisclosureComponent>
                ) : (
                  <ShadTooltip
                    content={nodeNames[SBSectionName] ?? nodeNames.unknown}
                    side="right"
                  >
                    <div className="p-2">
                      <IconComponent
                        name={SBSectionName}
                        className="h-8 w-8 text-primary"
                      />
                    </div>
                  </ShadTooltip>
                )}
              </React.Fragment>
            ) : null,
          )}
        {isExpanded && (
          <ParentDisclosureComponent
            defaultOpen={search.length !== 0 || getFilterEdge.length !== 0}
            key={`${search.length !== 0}-${getFilterEdge.length !== 0}-Advanced`}
            button={{
              title: "Experimental",
              Icon: nodeIconsLucide.unknown,
            }}
            testId="extended-disclosure"
          >
            {Object.keys(dataFilter)
              .sort(sortKeys)
              .filter((x) => !PRIORITY_SIDEBAR_ORDER.includes(x))
              .map((SBSectionName: keyof APIObjectType, index) =>
                Object.keys(dataFilter[SBSectionName]).length > 0 ? (
                  <React.Fragment key={index}>
                    <DisclosureComponent
                      isChild={false}
                      defaultOpen={
                        getFilterEdge.length !== 0 || search.length !== 0
                      }
                      button={{
                        title: nodeNames[SBSectionName] ?? nodeNames.unknown,
                        Icon:
                          nodeIconsLucide[SBSectionName] ??
                          nodeIconsLucide.unknown,
                      }}
                    >
                      <div className="side-bar-components-gap">
                        {Object.keys(dataFilter[SBSectionName])
                          .sort((a, b) =>
                            sensitiveSort(
                              dataFilter[SBSectionName][a].display_name,
                              dataFilter[SBSectionName][b].display_name,
                            ),
                          )
                          .map((SBItemName: string, index) => (
                            <ShadTooltip
                              content={
                                dataFilter[SBSectionName][SBItemName]
                                  .display_name
                              }
                              side="right"
                              key={index}
                            >
                              <SidebarDraggableComponent
                                sectionName={SBSectionName as string}
                                apiClass={dataFilter[SBSectionName][SBItemName]}
                                key={index}
                                onDragStart={(event) =>
                                  onDragStart(event, {
                                    type: removeCountFromString(SBItemName),
                                    node: dataFilter[SBSectionName][SBItemName],
                                  })
                                }
                                color={nodeColors[SBSectionName]}
                                itemName={SBItemName}
                                error={
                                  !!dataFilter[SBSectionName][SBItemName].error
                                }
                                display_name={
                                  dataFilter[SBSectionName][SBItemName]
                                    .display_name
                                }
                                official={
                                  dataFilter[SBSectionName][SBItemName]
                                    .official !== false
                                }
                              />
                            </ShadTooltip>
                          ))}
                      </div>
                    </DisclosureComponent>
                    {index ===
                      Object.keys(dataFilter).length -
                        PRIORITY_SIDEBAR_ORDER.length +
                        1 && (
                      <>
                        <a
                          target={"_blank"}
                          href="https://langflow.store"
                          className="components-disclosure-arrangement"
                        >
                          <div className="flex gap-4">
                            <SparklesIcon
                              strokeWidth={1.5}
                              className="w-[22px] text-primary"
                            />
                            <span className="components-disclosure-title">
                              Discover More
                            </span>
                          </div>
                          <div className="components-disclosure-div">
                            <div>
                              <LinkIcon className="h-4 w-4 text-foreground" />
                            </div>
                          </div>
                        </a>
                      </>
                    )}
                  </React.Fragment>
                ) : null,
              )}
          </ParentDisclosureComponent>
        )}
      </div>
      {isExpanded && (
        <div className="flex items-center justify-between p-4">
          {ModalMemo}
          {ExportMemo}
        </div>
      )}
    </div>
  );
}
